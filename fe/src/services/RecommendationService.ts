import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:3000",
});

export interface RecommendationProduct {
  _id?: string;
  title?: string;
  price?: number;
  discountPercentage?: number;
  rating?: number;
  stock?: number;
  thumbnail?: string;
  slug?: string;
}

export interface NextPurchaseRecommendationItem {
  productId: string;
  score: number;
  modelScore: number;
  popularityScore: number;
  product: RecommendationProduct;
}

export interface NextPurchaseRecommendationResponse {
  success: boolean;
  mode: string;
  metrics: Record<string, unknown>;
  data: {
    userId: string;
    recommendations: NextPurchaseRecommendationItem[];
    historyCount: number;
    trainingRows: number;
    featureCount?: number;
    trainingUsers?: number;
    note?: string;
  };
}

export const getNextPurchaseRecommendations = async (
  userId: string,
  limit: number = 8,
): Promise<NextPurchaseRecommendationResponse> => {
  const response = await axiosClient.get(
    `/recommendations/next-purchase/${userId}`,
    {
      params: { limit },
    },
  );

  return response.data;
};
