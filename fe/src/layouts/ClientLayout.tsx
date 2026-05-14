import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { MdFacebook, MdDashboard, MdPerson } from "react-icons/md";
import { FaTwitter, FaInstagram } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { logout } from "@/store/UserReducer";
import { clearCart } from "@/store/CartReducer";

const ClientLayout: React.FC = () => {
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.user.user);
  const cart = useSelector((state: RootState) => state.cart);

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800 shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-2">
          <div className="flex justify-between items-center gap-4">
            <NavLink to="/" className="flex items-center gap-2 group shrink-0">
              <div className="p-2 rounded-lg group-hover:bg-slate-700 transition-all">
                <img
                  src="/download.jpg"
                  alt="Logo"
                  className="w-14 h-14 object-cover rounded-full"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-100 hidden lg:block">Dark Hawk</h1>
            </NavLink>

            <nav className="hidden md:block flex-1">
              <ul className="flex gap-6 lg:gap-10 justify-center text-slate-300 text-base lg:text-lg font-medium">
                <li>
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `relative py-2 hover:text-slate-100 transition-colors ${
                        isActive ? "text-slate-100" : ""
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        Trang chủ
                        {isActive && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100" />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/cart"
                    className={({ isActive }) =>
                      `relative py-2 hover:text-slate-100 transition-colors ${
                        isActive ? "text-slate-100" : ""
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        Giỏ hàng
                        <span className="absolute top-0 right--1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                          {cart.length}
                        </span>
                        {isActive && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100" />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/invoices"
                    className={({ isActive }) =>
                      `relative py-2 hover:text-slate-100 transition-colors ${
                        isActive ? "text-slate-100" : ""
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        Hóa đơn
                        {isActive && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100" />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>

                {user && (
                  <li>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `relative py-2 hover:text-slate-100 transition-colors ${
                          isActive ? "text-slate-100" : ""
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          Thông tin cá nhân
                          {isActive && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )}

                <li>
                  <NavLink
                    to="/about"
                    className={({ isActive }) =>
                      `relative py-2 hover:text-slate-100 transition-colors ${
                        isActive ? "text-slate-100" : ""
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        Giới thiệu
                        {isActive && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-100" />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              </ul>
            </nav>

            <div className="flex items-center gap-4 shrink-0">
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-1 bg-slate-500 px-3 py-2 rounded-full text-sm lg:text-base"
                >
                  <MdDashboard size={20} /> <span className="hidden sm:inline">Trang quản trị</span>
                </button>
              )}

              <button
                onClick={() => (user ? handleLogout() : navigate("/auth"))}
                className="text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-1 bg-slate-500 px-3 py-2 rounded-full text-sm lg:text-base"
              >
                <MdPerson size={20} /> <span className="hidden sm:inline">{user ? "Đăng xuất" : "Đăng nhập"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <section className="bg-slate-900 border-y border-slate-800 text-slate-100 py-12">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Đăng ký nhận bản tin</h2>
          <p className="mb-6 text-slate-400">
            Nhận các ưu đãi và cập nhật mới nhất gửi trực tiếp đến hộp thư của
            bạn
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 py-3 px-5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-600"
            />
            <button className="bg-slate-100 text-slate-900 font-bold py-3 px-8 rounded-lg hover:bg-white transition-colors">
              Đăng ký
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-slate-100 font-bold text-lg mb-4">
                Về chúng tôi
              </h3>
              <p className="text-sm leading-relaxed">
                Điểm đến mua sắm trực tuyến đáng tin cậy của bạn với các sản
                phẩm chất lượng và giá cả hợp lý.
              </p>
            </div>

            <div>
              <h3 className="text-slate-100 font-bold text-lg mb-4">
                Liên kết nhanh
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.facebook.com/tran.dieu.ne"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/tran.dieu.ne"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/tran.dieu.ne"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Câu hỏi thường gặp
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/tran.dieu.ne"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Thông tin vận chuyển
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-slate-100 font-bold text-lg mb-4">
                Dịch vụ khách hàng
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Hoàn trả
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Điều khoản & Điều kiện
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-slate-100 transition-colors"
                  >
                    Theo dõi đơn hàng
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-slate-100 font-bold text-lg mb-4">
                Theo dõi chúng tôi
              </h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/tran.dieu.ne"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 p-3 text-center rounded-lg hover:bg-slate-800 transition-colors border border-slate-800"
                >
                  <MdFacebook size={20} />
                </a>
                <a
                  href="https://www.instagram.com/_trdieu.ne/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 p-3 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800"
                >
                  <FaTwitter size={20} />
                </a>
                <a
                  href="https://www.instagram.com/_trdieu.ne/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-900 p-3 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800"
                >
                  <FaInstagram size={20} />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 My Shop. Bảo lưu mọi quyền.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;
