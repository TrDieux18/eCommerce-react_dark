import { Request, Response } from "express";
import { getNextPurchasePredictions } from "../services/nextPurchasePrediction.service";

export const getNextPurchasePrediction = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params;
    const limit = Number.parseInt(String(req.query.limit ?? "5"), 10);
    const modelQuery = String(req.query.model ?? "auto").toLowerCase();
    const model =
      modelQuery === "knn" || modelQuery === "random_forest"
        ? modelQuery
        : "auto";

    const result = await getNextPurchasePredictions({
      userId,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 5,
      model,
    });

    // Cache debug header
    const cacheHit = result.cache?.hit ?? false;
    res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
    res.setHeader("X-Cache-Source", result.cache?.source ?? "unknown");

    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Unable to compute next purchase prediction",
    });
  }
};
