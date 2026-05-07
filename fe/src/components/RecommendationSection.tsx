import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store/store";
import { formatPrice } from "@/helpers/formatPrice";
import {
  getNextPurchaseRecommendations,
  type NextPurchaseRecommendationItem,
} from "@/services/RecommendationService";

const RecommendationSection = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState<
    NextPurchaseRecommendationItem[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?._id) {
        setRecommendations([]);
        return;
      }

      try {
        setLoading(true);
        const response = await getNextPurchaseRecommendations(user._id, 4);

        if (response.success && response.data?.recommendations) {
          setRecommendations(response.data.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?._id]);

  if (!user) return null;

  return (
    <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-100">
            Gợi ý theo lịch sử mua hàng
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Gợi ý dựa trên lịch sử mua hàng của bạn, xếp hạng theo xác suất
            mua tiếp theo.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Đang tạo gợi ý...</div>
      ) : recommendations.length === 0 ? (
        <div className="text-slate-400 text-sm">
          Chưa đủ dữ liệu để tạo gợi ý cá nhân hóa.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map((item) => {
            const recommendedProduct = item.product;
            const productPrice = recommendedProduct.price ?? 0;
            const discount = recommendedProduct.discountPercentage ?? 0;
            const discountedPrice =
              discount > 0
                ? productPrice - (productPrice * discount) / 100
                : productPrice;

            return (
              <button
                key={item.productId}
                type="button"
                onClick={() => navigate(`products/${item.productId}`)}
                className="text-left bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 transition-colors"
              >
                <div className="aspect-4/3 bg-[#F2F2F2] overflow-hidden">
                  <img
                    src={recommendedProduct.thumbnail}
                    alt={recommendedProduct.title}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-blue-400">
                    Score {item.score.toFixed(3)}
                  </p>
                  <h4 className="text-slate-100 font-semibold line-clamp-2 min-h-12">
                    {recommendedProduct.title}
                  </h4>
                  <div>
                    {discount > 0 ? (
                      <div className="space-y-1">
                        <div className="text-slate-100 font-bold">
                          {formatPrice(discountedPrice)}
                        </div>
                        <div className="text-slate-500 line-through text-sm">
                          {formatPrice(productPrice)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-100 font-bold">
                        {formatPrice(productPrice)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
