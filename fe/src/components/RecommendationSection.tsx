import { useEffect, useState, useMemo } from "react";
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
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(1);
  const [minScore, setMinScore] = useState<number>(0);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?._id) {
        setRecommendations([]);
        return;
      }

      try {
        setLoading(true);
        // Tăng số lượng gợi ý lên 12
        const response = await getNextPurchaseRecommendations(user._id, 12);

        if (response.success && response.data?.recommendations) {
          const recs = response.data.recommendations;
          setRecommendations(recs);
          
          if (recs.length > 0) {
            const scores = recs.map((item) => item.score);
            const highest = Math.max(...scores);
            const lowest = Math.min(...scores);
            
            setMaxScore(highest);
            setMinScore(lowest);
            // Mặc định cho phép hiển thị tất cả (lọc từ score thấp nhất)
            setMinScoreFilter(lowest);
          }
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

  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((item) => {
      return item.score >= minScoreFilter;
    });
  }, [recommendations, minScoreFilter]);

  if (!user) return null;

  return (
    <div className="mb-10 bg-slate-900 border border-slate-800 rounded-2xl p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 className="text-2xl font-semibold text-slate-100">
            Gợi ý theo lịch sử mua hàng
          </h3>
          <p className="text-slate-400 text-base mt-2">
            Gợi ý dựa trên lịch sử mua hàng của bạn, xếp hạng theo xác suất
            mua tiếp theo.
          </p>
        </div>
        
        {recommendations.length > 0 && maxScore > minScore && (
          <div className="flex flex-col gap-2 min-w-[250px]">
            <div className="flex justify-between items-center text-sm text-slate-300">
              <span>Lọc theo Score (tối thiểu):</span>
              <span className="font-semibold text-blue-400">{minScoreFilter.toFixed(3)}</span>
            </div>
            <input 
              type="range" 
              min={minScore} 
              max={maxScore} 
              step={(maxScore - minScore) / 100 || 0.01}
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400 py-8">Đang tạo gợi ý...</div>
      ) : recommendations.length === 0 ? (
        <div className="text-slate-400 text-base py-8">
          Chưa đủ dữ liệu để tạo gợi ý cá nhân hóa.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRecommendations.map((item) => {
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
                className="text-left bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-400 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-800/50"
              >
                <div className="aspect-4/3 bg-[#F2F2F2] overflow-hidden p-4">
                  <img
                    src={recommendedProduct.thumbnail}
                    alt={recommendedProduct.title}
                    className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-blue-400 font-medium">
                    Score {item.score.toFixed(3)}
                  </p>
                  <h4 className="text-slate-100 font-semibold line-clamp-2 min-h-12 text-lg">
                    {recommendedProduct.title}
                  </h4>
                  <div className="pt-2 border-t border-slate-700">
                    {discount > 0 ? (
                      <div className="space-y-1">
                        <div className="text-slate-100 font-bold text-xl">
                          {formatPrice(discountedPrice)}
                        </div>
                        <div className="text-slate-500 line-through text-sm">
                          {formatPrice(productPrice)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-100 font-bold text-xl">
                        {formatPrice(productPrice)}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredRecommendations.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400">
              Không có sản phẩm nào phù hợp với mức điểm này.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
