import { getProductById } from "@/services/ProductService";
import * as CartService from "@/services/CartService";
import * as InvoiceService from "@/services/InvoiceService";
import { getNextPurchaseRecommendations } from "@/services/RecommendationService";
import { setCart } from "@/store/CartReducer";
import type { AppDispatch, RootState } from "@/store/store";
import type { Product } from "@/types/Product";
import { formatPrice } from "@/helpers/formatPrice";
import {
  MdShoppingCart,
  MdStar,
  MdCheckCircle,
  MdLocalShipping,
  MdArrowBack,
} from "react-icons/md";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    Array<{
      productId: string;
      score: number;
      modelScore: number;
      popularityScore: number;
      product: {
        _id?: string;
        title?: string;
        price?: number;
        discountPercentage?: number;
        rating?: number;
        stock?: number;
        thumbnail?: string;
        slug?: string;
      };
    }>
  >([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response = await getProductById(id!);
        if (response.success && response.data) {
          setProduct(response.data);
        }
      } catch (error) {
        alert("Không thể tải thông tin sản phẩm!");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?._id) {
        setRecommendations([]);
        return;
      }

      try {
        setRecommendationLoading(true);
        const response = await getNextPurchaseRecommendations(user._id, 4);

        if (response.success && response.data?.recommendations) {
          setRecommendations(response.data.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (error) {
        setRecommendations([]);
      } finally {
        setRecommendationLoading(false);
      }
    };

    fetchRecommendations();
  }, [user?._id]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      alert("Vui lòng đăng nhập!");
      navigate("/auth");
      return;
    }

    try {
      const response = await CartService.addToCart(product._id, 1);
      if (response.success && response.data) {
        dispatch(setCart(response.data));
        alert(`Đã thêm sản phẩm vào giỏ hàng!`);
      }
    } catch (error) {
      alert("Thêm vào giỏ hàng thất bại!");
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    if (!user) {
      alert("Vui lòng đăng nhập!");
      navigate("/auth");
      return;
    }

    const products = [
      {
        productId: product._id,
        quantity: 1,
        price:
          product.discountPercentage > 0
            ? calculateDiscountedPrice(
                product.price,
                product.discountPercentage,
              )
            : product.price,
      },
    ];

    try {
      const response = await InvoiceService.createInvoice(
        user._id,
        products,
        false,
      );

      if (response.success) {
        alert("Đặt hàng thành công!");
        navigate("/invoices");
      } else {
        alert("Đặt hàng thất bại!");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400 text-xl">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400 text-xl">Không tìm thấy sản phẩm!</div>
      </div>
    );
  }

  const discountedPrice = calculateDiscountedPrice(
    product.price,
    product.discountPercentage,
  );

  return (
    <div className="space-y-12 px-4 md:px-8 lg:px-12 py-10 max-w-[1400px] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
      >
        <div className="bg-slate-800 p-2 rounded-full group-hover:bg-slate-700 transition-colors">
          <MdArrowBack size={20} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="font-medium">Quay lại</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Left Column - Image */}
        <div className="lg:col-span-5 xl:col-span-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative group sticky top-28">
            <div className="aspect-[4/5] sm:aspect-square bg-[#F2F2F2] relative p-8">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              {product.discountPercentage > 0 && (
                <div className="absolute top-6 left-6 bg-gradient-to-r from-red-500 to-pink-500 text-white px-5 py-2 rounded-full text-lg font-bold shadow-lg shadow-red-500/30">
                  -{product.discountPercentage}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center space-y-10">
          <div className="space-y-5">
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                <MdStar className="text-yellow-400" size={18} />
                <span className="text-slate-200">{product.rating} / 5.0</span>
              </div>
              <div className="bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 text-blue-400">
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.2] tracking-tight">
              {product.title}
            </h1>

            <div className="pt-4">
              {product.discountPercentage > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-end gap-4">
                    <span className="text-5xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                      {formatPrice(discountedPrice)}
                    </span>
                    <span className="text-2xl text-slate-500 line-through font-medium pb-1">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <div className="inline-block bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm font-bold">
                    Tiết kiệm {formatPrice(product.price - discountedPrice)}
                  </div>
                </div>
              ) : (
                <span className="text-5xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Mô tả chi tiết
            </h3>
            <p className="text-slate-300 leading-relaxed text-lg">
              {product.description || "Chưa có mô tả chi tiết cho sản phẩm này. Vui lòng liên hệ hỗ trợ để biết thêm thông tin."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
              <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                <MdCheckCircle size={28} className="text-green-400" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">Chính hãng</div>
                <div className="text-slate-400 text-sm">100% authentic</div>
              </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
              <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
                <MdLocalShipping size={28} className="text-blue-400" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">Miễn phí</div>
                <div className="text-slate-400 text-sm">Giao hàng nhanh</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:from-blue-500 hover:to-indigo-500 transition-all hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {product.stock === 0 ? "Hết hàng" : "Mua ngay"}
            </button>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-slate-800 border border-slate-700 text-white py-4 px-8 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <MdShoppingCart size={24} />
              <span>{product.stock === 0 ? "Hết hàng" : "Thêm giỏ hàng"}</span>
            </button>
          </div>
        </div>
      </div>

      {user && (
        <div className="pt-16 mt-8 border-t border-slate-800/60">
          <div className="flex flex-col items-center text-center mb-10">
            <h3 className="text-3xl font-bold text-white mb-3">
              Gợi ý dành riêng cho bạn
            </h3>
            <p className="text-slate-400 text-lg max-w-2xl">
              Dựa trên lịch sử và sở thích của bạn, AI của chúng tôi đề xuất những sản phẩm này
            </p>
          </div>

          {recommendationLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-slate-400 text-lg animate-pulse">Đang phân tích gợi ý...</div>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center text-slate-500 py-12">
              Chưa có đủ dữ liệu để tạo gợi ý cá nhân hóa.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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
                    onClick={() => navigate(`/products/${item.productId}`)}
                    className="text-left bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-500 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-800/50 group"
                  >
                    <div className="aspect-[4/3] bg-[#F2F2F2] overflow-hidden p-6 relative">
                      <img
                        src={recommendedProduct.thumbnail}
                        alt={recommendedProduct.title}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      {discount > 0 && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                          -{discount}%
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-blue-400 font-bold bg-blue-400/10 px-2 py-1 rounded-md">
                          Score {item.score.toFixed(3)}
                        </span>
                      </div>
                      <h4 className="text-slate-100 font-bold text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-blue-400 transition-colors">
                        {recommendedProduct.title}
                      </h4>
                      <div className="pt-3 border-t border-slate-800">
                        {discount > 0 ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-slate-100 font-black text-xl">
                              {formatPrice(discountedPrice)}
                            </span>
                            <span className="text-slate-500 line-through text-sm">
                              {formatPrice(productPrice)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-100 font-black text-xl">
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
      )}
    </div>
  );
};

export default ProductDetail;
