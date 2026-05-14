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
      className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-600 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 group cursor-pointer flex flex-col h-full"
    >
      <div className="relative overflow-hidden bg-[#F2F2F2] w-full pt-[100%]">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {product.discountPercentage > 0 && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg shadow-red-500/30">
            -{product.discountPercentage}%
          </div>
        )}

        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md text-slate-100 px-3 py-1 rounded-lg text-xs font-medium border border-slate-700/50">
          Còn {product.stock}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-md border border-slate-700/50">
            <MdStar className="text-yellow-400" size={16} />
            <span className="text-slate-200 text-sm font-semibold">
              {product.rating}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-100 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>

        <div className="pt-2 mt-auto border-t border-slate-800/60 pb-2">
          {product.discountPercentage > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {formatPrice(discountedPrice)}
                </span>
              </div>
              <span className="text-slate-500 line-through text-sm font-medium">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              isLoggedIn ? onBuyNow(product) : navigate("/auth");
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm hover:from-blue-500 hover:to-indigo-500 transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            {isLoggedIn ? "Mua ngay" : "Đăng nhập"}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              isLoggedIn ? onAddToCart(product) : navigate("/auth");
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-3 rounded-xl font-bold transition-all flex items-center justify-center hover:shadow-lg"
            title="Thêm vào giỏ hàng"
          >
            <MdShoppingCart size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
