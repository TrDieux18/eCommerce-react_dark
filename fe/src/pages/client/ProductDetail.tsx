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
    <div className="space-y-4 px-8 ">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
      >
        <MdArrowBack size={24} />
        <span>Quay lại</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="aspect-square bg-[#F2F2F2] relative">
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-contain"
            />
            {product.discountPercentage > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-lg font-bold">
                -{product.discountPercentage}%
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <MdStar className="text-yellow-400" size={24} />
                <span className="text-slate-100 font-semibold text-xl">
                  {product.rating}
                </span>
              </div>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                {product.stock} sản phẩm có sẵn
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-100 mb-4">
              {product.title}
            </h1>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              {product.discountPercentage > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-slate-100">
                      {formatPrice(discountedPrice)}
                    </span>
                    <span className="text-xl text-slate-500 line-through">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                  <div className="text-red-400 font-medium">
                    Tiết kiệm {formatPrice(product.price - discountedPrice)}
                  </div>
                </div>
              ) : (
                <span className="text-4xl font-bold text-slate-100">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">Mô tả</h3>
            <p className="text-slate-300 leading-relaxed">
              {product.description || "Chưa có mô tả chi tiết"}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock === 0 ? "Hết hàng" : "Mua ngay"}
            </button>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdShoppingCart size={24} />
              {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </div>

          {user && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Dự đoán sản phẩm mua tiếp theo
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  Gợi ý được xếp hạng theo lịch sử mua hàng của bạn.
                </p>
              </div>

              {recommendationLoading ? (
                <div className="text-slate-400">Đang tạo gợi ý...</div>
              ) : recommendations.length === 0 ? (
                <div className="text-slate-400 text-sm">
                  Chưa có đủ dữ liệu để tạo gợi ý cá nhân hóa.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="text-left bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-500 transition-colors"
                      >
                        <div className="aspect-[4/3] bg-[#F2F2F2] overflow-hidden">
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="bg-slate-800 p-3 rounded-lg">
                <MdCheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <div className="text-slate-100 font-semibold">Chính hãng</div>
                <div className="text-slate-400 text-sm">100% authentic</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="bg-slate-800 p-3 rounded-lg">
                <MdLocalShipping size={24} className="text-blue-400" />
              </div>
              <div>
                <div className="text-slate-100 font-semibold">Miễn phí</div>
                <div className="text-slate-400 text-sm">Giao hàng nhanh</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
