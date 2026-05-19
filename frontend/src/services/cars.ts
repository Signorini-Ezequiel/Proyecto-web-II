import type { Car, FilterCarsDto } from "../types/car";
import { apiGet } from "./api";

export async function getCars(filters: FilterCarsDto = {}): Promise<Car[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return apiGet<Car[]>(query ? `cars?${query}` : "cars");
}
