import { MdCheckCircle, MdAttachMoney, MdFlashOn } from "react-icons/md";

const FEATURES = [
  {
    icon: MdCheckCircle,
    title: "Chính hãng 100%",
    description: "Cam kết sản phẩm chính hãng, bảo hành đầy đủ",
    color: "from-green-500 to-emerald-400",
    shadow: "shadow-green-500/20"
  },
  {
    icon: MdAttachMoney,
    title: "Giá cực tốt",
    description: "Luôn mang đến mức giá ưu đãi nhất thị trường",
    color: "from-blue-500 to-indigo-400",
    shadow: "shadow-blue-500/20"
  },
  {
    icon: MdFlashOn,
    title: "Giao siêu tốc",
    description: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ",
    color: "from-amber-500 to-orange-400",
    shadow: "shadow-amber-500/20"
  },
];

const FeatureHighlights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-12 pb-6">
      {FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 text-center hover:-translate-y-2 transition-transform duration-500 group"
        >
          <div className={`bg-gradient-to-br ${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform duration-500`}>
            <feature.icon size={32} className="text-white" />
          </div>
          <h3 className="text-white font-bold text-xl mb-3">
            {feature.title}
          </h3>
          <p className="text-slate-400 text-base leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FeatureHighlights;
