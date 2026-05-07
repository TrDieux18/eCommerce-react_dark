import { deleteProduct, getAllProducts } from "@/services/ProductService";
import type { Product } from "@/types/Product";
import type { ApiResponse } from "@/types/Response";
import { formatPrice } from "@/helpers/formatPrice";
import SearchInput from "@/components/SearchInput";
import CategorySelect from "@/components/CategorySelect";
import Pagination from "@/components/Pagination";
import { CATEGORIES } from "@/constants/categories";
import { useEffect, useState } from "react";
import { MdEdit, MdDelete, MdAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params: Record<string, string> = {
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
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

  const handleEdit = (id: string) => {
    navigate(`/admin/products/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa sản phẩm này?",
    );
    if (confirmDelete) {
      try {
        const response = await deleteProduct(id);
        if (!response.success) {
          alert("Xóa sản phẩm thất bại, vui lòng thử lại!");
          return;
        }
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product._id !== id),
        );
        alert("Xóa sản phẩm thành công!");
      } catch (error) {
        alert("Xóa sản phẩm thất bại, vui lòng thử lại!");
      }
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">
            Quản lý sản phẩm
          </h2>
          <p className="text-slate-400 mt-1">
            Tổng số: {products.length} sản phẩm
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="flex items-center gap-2 bg-slate-100 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors"
        >
          <MdAdd size={20} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
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

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Hình ảnh
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Đánh giá
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-slate-800/50 transition-colors"
                  onClick={() =>
                    navigate(`/admin/products/edit/${product._id}`)
                  }
                >
                  <td className="px-6 py-4">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-100">
                      {product.title}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-100">
                      {formatPrice(product.price)}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-slate-100 font-medium">
                        {product.rating}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 20
                          ? "bg-green-900/20 text-green-400 border border-green-800"
                          : product.stock > 0
                            ? "bg-yellow-900/20 text-yellow-400 border border-yellow-800"
                            : "bg-red-900/20 text-red-400 border border-red-800"
                      }`}
                    >
                      {product.stock} sp
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product._id)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400 text-lg">
                Không tìm thấy sản phẩm nào
              </div>
            </div>
          )}
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ProductPage;
