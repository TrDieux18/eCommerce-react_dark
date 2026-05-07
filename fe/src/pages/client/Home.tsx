import { getAllProducts } from "@/services/ProductService";
import * as CartService from "@/services/CartService";
import * as InvoiceService from "@/services/InvoiceService";
import { setCart } from "@/store/CartReducer";
import type { AppDispatch, RootState } from "@/store/store";
import type { Product } from "@/types/Product";
import type { ApiResponse } from "@/types/Response";
import SearchInput from "@/components/SearchInput";
import CategorySelect from "@/components/CategorySelect";
import Pagination from "@/components/Pagination";
import RecommendationSection from "@/components/RecommendationSection";
import ProductCard from "@/components/ProductCard";
import FeatureHighlights from "@/components/FeatureHighlights";
import { CATEGORIES } from "@/constants/categories";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

const calculateDiscountedPrice = (price: number, discount: number) => {
  return price - (price * discount) / 100;
};

const HomePage = () => {
  const user = useSelector((state: RootState) => state.user.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // --- Debounce search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Fetch products ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        };

        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (selectedCategory && selectedCategory !== "all")
          params.category = selectedCategory;

        const response: ApiResponse<Product[]> = await getAllProducts(params);

        if (response.success && response.data) {
          setProducts(response.data);
          if (response.totalPages) {
            setTotalPages(response.totalPages);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, debouncedSearchTerm, selectedCategory]);

  // --- Handlers ---
  const handleAddToCart = async (product: Product) => {
    try {
      const response = await CartService.addToCart(product._id);
      if (response.success && response.data) {
        dispatch(setCart(response.data));
        alert("Đã thêm vào giỏ hàng!");
      }
    } catch (error) {
      alert("Thêm vào giỏ hàng thất bại!");
    }
  };

  const handleBuyNow = async (product: Product) => {
    if (!user) {
      alert("Vui lòng đăng nhập!");
      navigate("/auth");
      return;
    }

    const discountedPrice =
      product.discountPercentage > 0
        ? calculateDiscountedPrice(product.price, product.discountPercentage)
        : product.price;

    const products = [
      {
        productId: product._id,
        quantity: 1,
        price: discountedPrice,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-8">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchInput
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />

        <CategorySelect
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value);
            setCurrentPage(1);
          }}
          categories={CATEGORIES}
        />
      </div>

      {/* Products section */}
      <div>
        <h2 className="text-3xl font-bold text-slate-100 mb-6">
          Sản Phẩm Nổi Bật
        </h2>

        {/* AI Recommendations */}
        <RecommendationSection />

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isLoggedIn={!!user}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Feature Highlights */}
      <FeatureHighlights />
    </div>
  );
};

export default HomePage;
