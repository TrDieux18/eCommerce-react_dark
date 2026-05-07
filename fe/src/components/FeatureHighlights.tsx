import { MdCheckCircle, MdAttachMoney, MdFlashOn } from "react-icons/md";

const FEATURES = [
  {
    icon: MdCheckCircle,
    title: "Chính hãng 100%",
    description: "Cam kết sản phẩm chính hãng, bảo hành đầy đủ",
  },
  {
    icon: MdAttachMoney,
    title: "Giá tốt nhất",
    description: "Cam kết giá rẻ nhất thị trường",
  },
  {
    icon: MdFlashOn,
    title: "Giao hàng nhanh",
    description: "Miễn phí ship đơn từ 500k",
  },
];

const FeatureHighlights = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
      {FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center"
        >
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <feature.icon size={32} className="text-slate-100" />
          </div>
          <h3 className="text-slate-100 font-bold text-lg mb-2">
            {feature.title}
          </h3>
          <p className="text-slate-400 text-sm">{feature.description}</p>
        </div>
      ))}
    </div>
  );
};

export default FeatureHighlights;
