import { useNavigate } from "react-router-dom";
import { MdShoppingCart, MdStar } from "react-icons/md";
import { formatPrice } from "@/helpers/formatPrice";
import type { Product } from "@/types/Product";

interface ProductCardProps {
  product: Product;
  isLoggedIn: boolean;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const calculateDiscountedPrice = (price: number, discount: number) => {
  return price - (price * discount) / 100;
};

const ProductCard = ({
  product,
  isLoggedIn,
  onBuyNow,
  onAddToCart,
}: ProductCardProps) => {
  const navigate = useNavigate();

  const discountedPrice = calculateDiscountedPrice(
    product.price,
    product.discountPercentage,
  );

  return (
    <div
      onClick={() => navigate(`products/${product._id}`)}
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-300 group cursor-pointer"
    >
      <div className="relative overflow-hidden bg-[#F2F2F2] w-full h-55">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-55 object-contain group-hover:scale-120 transition-transform duration-500"
          loading="lazy"
        />

        {product.discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            -{product.discountPercentage}%
          </div>
        )}

        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-slate-100 px-3 py-1 rounded-full text-xs">
          Còn {product.stock} sp
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <MdStar className="text-yellow-400" size={16} />
            <span className="text-slate-100 font-semibold">
              {product.rating}
            </span>
          </div>
          <span className="text-slate-500 text-sm">
            ({product.stock} đánh giá)
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-100 line-clamp-2 min-h-14 group-hover:underline">
          {product.title}
        </h3>

        <div className="pt-2 border-t border-slate-800">
          {product.discountPercentage > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-100">
                  {formatPrice(discountedPrice)}
                </span>
              </div>
              <span className="text-slate-500 line-through text-sm">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-slate-100">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            isLoggedIn ? onBuyNow(product) : navigate("/auth");
          }}
          className="w-full bg-slate-300 text-slate-900 py-3 rounded-lg font-semibold hover:bg-white transition-colors"
        >
          {isLoggedIn ? "Mua ngay" : "Đăng nhập để mua"}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            isLoggedIn ? onAddToCart(product) : navigate("/auth");
          }}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 group-hover:bg-slate-100 group-hover:text-slate-900"
        >
          {isLoggedIn ? (
            <>
              <MdShoppingCart size={20} />
              Thêm vào giỏ hàng
            </>
          ) : (
            "Đăng nhập để thêm vào giỏ hàng"
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
