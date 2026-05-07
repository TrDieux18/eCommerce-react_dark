#!/usr/bin/env python3
"""
Next Purchase Prediction – KNN-based collaborative filtering.

Approach:
  Instead of treating this as a multi-class classification problem (predict
  the exact next product from ALL products), we use KNN in a simpler, more
  effective way:

  1. Build a "user–product interaction matrix" where each row is a user and
     each column is a product. Values = purchase count (or 0).
  2. For a target user, find the K most similar users using cosine distance
     on their purchase vectors.
  3. Recommend products that similar users bought but the target user hasn't.
  4. Blend with global popularity for cold-start resilience.

  This is a classic "User-based Collaborative Filtering with KNN" and works
  well even with small datasets (≥2 users, ≥3 products).
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def json_error(message: str, details: Optional[Dict[str, Any]] = None) -> None:
    payload: Dict[str, Any] = {"success": False, "message": message}
    if details:
        payload["details"] = details
    sys.stderr.write(json.dumps(payload, ensure_ascii=True) + "\n")


def get_mongo_uri() -> str:
    uri = os.getenv("MONGO_URL") or os.getenv("MONGODB_URI")
    if not uri:
        raise RuntimeError("Missing MONGO_URL or MONGODB_URI")
    return uri


def connect_db():
    client = MongoClient(get_mongo_uri(), serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    return client


def ensure_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if value is None:
        return datetime.now(timezone.utc)
    if hasattr(value, "to_pydatetime"):
        return value.to_pydatetime()
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def build_catalog(products: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    catalog: Dict[str, Dict[str, Any]] = {}
    for product in products:
        product_id = str(product.get("_id"))
        catalog[product_id] = {
            "_id": product_id,
            "title": product.get("title", ""),
            "price": float(product.get("price", 0) or 0),
            "discountPercentage": float(product.get("discountPercentage", 0) or 0),
            "rating": float(product.get("rating", 0) or 0),
            "stock": float(product.get("stock", 0) or 0),
            "thumbnail": product.get("thumbnail", ""),
            "slug": product.get("slug", ""),
        }
    return catalog


def build_user_purchase_history(
    invoices: List[Dict[str, Any]],
) -> Dict[str, Counter]:
    """Build {userId: Counter({productId: purchase_count})} from invoices."""
    history: Dict[str, Counter] = defaultdict(Counter)

    for invoice in invoices:
        user_id = str(invoice.get("userId"))
        for item in invoice.get("products", []) or []:
            product_id = str(item.get("productId"))
            quantity = max(int(item.get("quantity", 1) or 1), 1)
            history[user_id][product_id] += quantity

    return dict(history)


def build_purchase_sequences(
    invoices: List[Dict[str, Any]],
) -> Dict[str, List[str]]:
    """Build {userId: [productId, productId, ...]} ordered by time."""
    events: Dict[str, List[tuple]] = defaultdict(list)

    for invoice in invoices:
        user_id = str(invoice.get("userId"))
        created_at = ensure_datetime(invoice.get("createdAt"))
        for item in invoice.get("products", []) or []:
            product_id = str(item.get("productId"))
            events[user_id].append((created_at, product_id))

    sequences: Dict[str, List[str]] = {}
    for user_id, event_list in events.items():
        event_list.sort(key=lambda x: x[0])
        sequences[user_id] = [pid for _, pid in event_list]

    return sequences


def build_popularity(invoices: List[Dict[str, Any]]) -> Dict[str, float]:
    counts: Counter = Counter()
    for invoice in invoices:
        for item in invoice.get("products", []) or []:
            product_id = str(item.get("productId"))
            quantity = max(int(item.get("quantity", 1) or 1), 1)
            counts[product_id] += quantity

    if not counts:
        return {}

    max_count = max(counts.values())
    return {pid: count / max_count for pid, count in counts.items()}


# ---------------------------------------------------------------------------
# Co-purchase patterns (products frequently bought together / sequentially)
# ---------------------------------------------------------------------------

def build_co_purchase_scores(
    sequences: Dict[str, List[str]],
) -> Dict[str, Counter]:
    """
    For each product A, count how often product B was purchased AFTER A
    (within the same user's history). This captures sequential patterns.
    """
    co_purchase: Dict[str, Counter] = defaultdict(Counter)

    for user_id, seq in sequences.items():
        for i, product_a in enumerate(seq):
            # Look at next 5 products purchased after A
            for product_b in seq[i + 1: i + 6]:
                if product_b != product_a:
                    co_purchase[product_a][product_b] += 1

    return dict(co_purchase)


# ---------------------------------------------------------------------------
# User-based collaborative filtering with KNN (cosine similarity)
# ---------------------------------------------------------------------------

def build_user_product_matrix(
    user_history: Dict[str, Counter],
    all_product_ids: List[str],
) -> tuple:
    """
    Build a user×product matrix.
    Returns (matrix: np.ndarray, user_ids: List[str], product_index: Dict[str, int])
    """
    product_index = {pid: idx for idx, pid in enumerate(all_product_ids)}
    user_ids = list(user_history.keys())
    matrix = np.zeros((len(user_ids), len(all_product_ids)), dtype=np.float32)

    for row, user_id in enumerate(user_ids):
        for pid, count in user_history[user_id].items():
            if pid in product_index:
                matrix[row, product_index[pid]] = float(count)

    return matrix, user_ids, product_index


def knn_recommend(
    target_user_id: str,
    user_history: Dict[str, Counter],
    matrix: np.ndarray,
    user_ids: List[str],
    product_index: Dict[str, int],
    k: int = 5,
) -> Dict[str, float]:
    """
    Find K most similar users and score products they bought
    but the target user hasn't.
    """
    if target_user_id not in user_history:
        return {}

    target_idx = None
    for i, uid in enumerate(user_ids):
        if uid == target_user_id:
            target_idx = i
            break

    if target_idx is None:
        return {}

    # Compute cosine similarity between target and all other users
    target_vector = matrix[target_idx: target_idx + 1]  # (1, n_products)

    if target_vector.sum() == 0:
        return {}

    similarities = cosine_similarity(target_vector, matrix)[0]  # (n_users,)
    similarities[target_idx] = -1  # exclude self

    # Get top K similar users
    k_actual = min(k, len(user_ids) - 1)
    if k_actual <= 0:
        return {}

    top_k_indices = np.argsort(similarities)[-k_actual:][::-1]
    top_k_sims = similarities[top_k_indices]

    # Only consider users with positive similarity
    valid = top_k_sims > 0
    top_k_indices = top_k_indices[valid]
    top_k_sims = top_k_sims[valid]

    if len(top_k_indices) == 0:
        return {}

    # Products the target user already bought
    target_products = set(user_history[target_user_id].keys())

    # Score products from similar users
    inv_product_index = {idx: pid for pid, idx in product_index.items()}
    product_scores: Dict[str, float] = defaultdict(float)
    weight_sum: Dict[str, float] = defaultdict(float)

    for neighbor_idx, sim in zip(top_k_indices, top_k_sims):
        neighbor_vector = matrix[neighbor_idx]
        for col in np.nonzero(neighbor_vector)[0]:
            pid = inv_product_index[int(col)]
            if pid not in target_products:
                product_scores[pid] += sim * float(neighbor_vector[col])
                weight_sum[pid] += sim

    # Normalize scores to 0-1 range
    if product_scores:
        for pid in product_scores:
            if weight_sum[pid] > 0:
                product_scores[pid] /= weight_sum[pid]

        max_score = max(product_scores.values()) if product_scores else 1.0
        if max_score > 0:
            for pid in product_scores:
                product_scores[pid] /= max_score

    return dict(product_scores)


def compute_content_similarity(
    catalog: Dict[str, Dict[str, Any]],
    bought_products: set,
) -> Dict[str, float]:
    """
    Score unbought products by how similar they are to products the user
    already purchased (based on price, rating, discount).
    """
    if not bought_products:
        return {}

    # Compute average attributes of bought products
    bought_attrs = []
    for pid in bought_products:
        if pid in catalog:
            p = catalog[pid]
            bought_attrs.append([p["price"], p["rating"], p["discountPercentage"]])

    if not bought_attrs:
        return {}

    avg_price = np.mean([a[0] for a in bought_attrs])
    avg_rating = np.mean([a[1] for a in bought_attrs])
    avg_discount = np.mean([a[2] for a in bought_attrs])

    # Score each unbought product by distance from user's preference center
    scores: Dict[str, float] = {}
    for pid, product in catalog.items():
        if pid in bought_products:
            continue

        # Normalized distance (lower = more similar)
        price_diff = abs(product["price"] - avg_price) / max(avg_price, 1)
        rating_diff = abs(product["rating"] - avg_rating) / 5.0
        discount_diff = abs(product["discountPercentage"] - avg_discount) / 100.0

        distance = (0.5 * price_diff) + (0.3 * rating_diff) + (0.2 * discount_diff)
        scores[pid] = max(0.0, 1.0 - distance)  # Convert distance to similarity

    # Normalize to 0-1
    if scores:
        max_s = max(scores.values())
        if max_s > 0:
            for pid in scores:
                scores[pid] /= max_s

    return scores


def rank_recommendations(
    knn_scores: Dict[str, float],
    co_purchase_scores: Dict[str, Counter],
    user_last_products: List[str],
    popularity: Dict[str, float],
    catalog: Dict[str, Dict[str, Any]],
    bought_products: set,
    limit: int,
) -> List[Dict[str, Any]]:
    """
    Blend 4 signal sources with adaptive weights:
      - KNN collaborative filtering (when multiple users exist)
      - Co-purchase sequential patterns
      - Content-based similarity (price/rating/discount)
      - Global popularity
    """
    # Co-purchase scores from user's recent products
    co_scores: Dict[str, float] = defaultdict(float)
    recent = user_last_products[-5:]
    for pid in recent:
        if pid in co_purchase_scores:
            for next_pid, count in co_purchase_scores[pid].items():
                if next_pid not in bought_products:
                    co_scores[next_pid] += float(count)

    if co_scores:
        max_co = max(co_scores.values())
        if max_co > 0:
            for pid in co_scores:
                co_scores[pid] /= max_co

    # Content-based similarity
    content_scores = compute_content_similarity(catalog, bought_products)

    # Adaptive weights: if KNN has no signal, redistribute to other signals
    has_knn = any(v > 0 for v in knn_scores.values())
    has_co = any(v > 0 for v in co_scores.values())

    if has_knn:
        w_knn, w_co, w_content, w_pop = 0.35, 0.30, 0.20, 0.15
    elif has_co:
        w_knn, w_co, w_content, w_pop = 0.0, 0.40, 0.35, 0.25
    else:
        w_knn, w_co, w_content, w_pop = 0.0, 0.0, 0.55, 0.45

    # Blend scores
    final_scores: List[Dict[str, Any]] = []

    for product_id, product in catalog.items():
        if product_id in bought_products:
            continue

        knn_s = knn_scores.get(product_id, 0.0)
        co_s = co_scores.get(product_id, 0.0)
        content_s = content_scores.get(product_id, 0.0)
        pop_s = popularity.get(product_id, 0.0)

        blended = (w_knn * knn_s) + (w_co * co_s) + (w_content * content_s) + (w_pop * pop_s)

        final_scores.append({
            "productId": product_id,
            "score": round(float(blended), 4),
            "modelScore": round(float(knn_s + co_s + content_s) / 3, 4),
            "popularityScore": round(float(pop_s), 4),
            "product": product,
        })

    final_scores.sort(key=lambda x: x["score"], reverse=True)
    return final_scores[:limit]


def popularity_recommendations(
    popularity: Dict[str, float],
    catalog: Dict[str, Dict[str, Any]],
    limit: int,
) -> List[Dict[str, Any]]:
    return [
        {
            "productId": pid,
            "score": round(float(score), 4),
            "modelScore": 0.0,
            "popularityScore": round(float(score), 4),
            "product": catalog[pid],
        }
        for pid, score in sorted(popularity.items(), key=lambda x: x[1], reverse=True)
        if pid in catalog
    ][:limit]


# ---------------------------------------------------------------------------
# Cache management
# ---------------------------------------------------------------------------

def get_fingerprint(invoices: List[Dict[str, Any]], products: List[Dict[str, Any]]) -> str:
    latest_invoice = max(
        [ensure_datetime(inv.get("createdAt")) for inv in invoices],
        default=datetime.fromtimestamp(0, tz=timezone.utc),
    )
    latest_product = max(
        [ensure_datetime(p.get("updatedAt") or p.get("createdAt")) for p in products],
        default=datetime.fromtimestamp(0, tz=timezone.utc),
    )
    return f"{len(invoices)}|{len(products)}|{latest_invoice.isoformat()}|{latest_product.isoformat()}"


def cache_dir() -> str:
    custom = os.getenv("NEXT_PURCHASE_CACHE_DIR")
    if custom:
        return custom
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache", "next_purchase")


def cache_path(fingerprint: str) -> str:
    safe = fingerprint.replace("|", "__").replace(":", "-")
    return os.path.join(cache_dir(), f"{safe}.joblib")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Next Purchase Prediction (KNN Collaborative Filtering)"
    )
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument(
        "--predict-only", action="store_true",
        help="Only predict using cached model; exit 2 if no cache",
    )
    parser.add_argument("--model", choices=["auto", "knn", "random_forest"], default="auto")
    args = parser.parse_args()

    try:
        client = connect_db()
        db = client.get_default_database()

        invoices = list(db["invoices"].find(
            {"status": {"$ne": "cancelled"}},
            {"userId": 1, "products": 1, "totalAmount": 1, "createdAt": 1},
        ))
        products = list(db["products"].find(
            {},
            {"title": 1, "price": 1, "discountPercentage": 1, "rating": 1,
             "stock": 1, "thumbnail": 1, "slug": 1},
        ))

        catalog = build_catalog(products)
        all_product_ids = list(catalog.keys())
        user_history = build_user_purchase_history(invoices)
        sequences = build_purchase_sequences(invoices)
        popularity = build_popularity(invoices)
        fingerprint = get_fingerprint(invoices, products)
        artifact_path = cache_path(fingerprint)
        from_cache = False

        total_events = sum(len(seq) for seq in sequences.values())
        total_users = len(user_history)

        # --- Not enough data ---
        if total_events < 2:
            recs = popularity_recommendations(popularity, catalog, args.limit)
            print(json.dumps({
                "success": True,
                "mode": "fallback_popularity",
                "metrics": {},
                "data": {
                    "userId": args.user_id,
                    "recommendations": recs,
                    "historyCount": len(sequences.get(args.user_id, [])),
                    "trainingRows": total_events,
                    "note": "Not enough purchase data to build KNN model.",
                },
            }, ensure_ascii=True))
            return 0

        # --- Load or build model ---
        if os.path.exists(artifact_path):
            artifact = joblib.load(artifact_path)
            from_cache = True
        elif args.predict_only:
            print(json.dumps({
                "success": False,
                "message": "no_cache",
                "note": "No cached model; full build required.",
            }, ensure_ascii=True))
            return 2
        else:
            # Build the model
            matrix, user_ids, product_index = build_user_product_matrix(
                user_history, all_product_ids,
            )
            co_purchase = build_co_purchase_scores(sequences)

            artifact = {
                "matrix": matrix,
                "user_ids": user_ids,
                "product_index": product_index,
                "co_purchase": co_purchase,
                "catalog": catalog,
                "popularity": popularity,
                "user_history": user_history,
                "sequences": sequences,
            }
            os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
            joblib.dump(artifact, artifact_path)

        # --- Extract from artifact ---
        matrix = artifact["matrix"]
        user_ids = artifact["user_ids"]
        product_index = artifact["product_index"]
        co_purchase = artifact["co_purchase"]
        stored_catalog = artifact["catalog"]
        stored_popularity = artifact["popularity"]
        stored_history = artifact["user_history"]
        stored_sequences = artifact["sequences"]

        # Use latest catalog/popularity but cached model structure
        cat = catalog if not from_cache else stored_catalog
        pop = popularity if not from_cache else stored_popularity
        hist = user_history if not from_cache else stored_history
        seqs = sequences if not from_cache else stored_sequences

        # --- Generate recommendations ---
        user_seq = seqs.get(args.user_id, [])
        user_bought = set(hist.get(args.user_id, {}).keys())

        if not user_seq:
            # User has no history → popularity fallback
            recs = popularity_recommendations(pop, cat, args.limit)
        else:
            # KNN collaborative filtering
            k = min(5, max(1, total_users - 1))
            knn_scores = knn_recommend(
                args.user_id, hist, matrix, user_ids, product_index, k=k,
            )

            recs = rank_recommendations(
                knn_scores, co_purchase, user_seq, pop, cat, user_bought, args.limit,
            )

        payload = {
            "success": True,
            "mode": "knn",
            "cache": {
                "hit": from_cache,
                "path": artifact_path,
                "fingerprint": fingerprint,
            },
            "metrics": {
                "knn": {
                    "total_users": total_users,
                    "total_products": len(all_product_ids),
                    "total_events": total_events,
                    "k_neighbors": min(5, max(1, total_users - 1)),
                },
                "selected": 1.0,
            },
            "data": {
                "userId": args.user_id,
                "recommendations": recs,
                "historyCount": len(user_seq),
                "trainingRows": total_events,
                "featureCount": len(all_product_ids),
                "trainingUsers": total_users,
            },
        }
        print(json.dumps(payload, ensure_ascii=True))
        return 0

    except Exception as exc:
        json_error(str(exc), {"type": exc.__class__.__name__})
        return 1


if __name__ == "__main__":
    raise SystemExit(main())