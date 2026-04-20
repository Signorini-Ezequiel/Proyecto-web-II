import type { Car } from "../data/cars";
import type { ComparisonMetrics } from "./scoring";

export function generateCarSummary(car: Car, metrics: ComparisonMetrics): string {
  const isWinner = metrics.overallWinner.carId === car.id;

  if (!isWinner) {
    return "";
  }

  const summaries: Record<string, string> = {
    "1": `El ${car.make} ${car.model} se destaca como la mejor opción en esta comparación. Con un precio competitivo de $${car.price.toLocaleString()}, combina excelente relación calidad-precio con un equipamiento moderno que incluye ${car.specs.features.length} características destacadas. Su ${car.year} año y potencia de ${car.specs.power} lo posicionan como la alternativa más equilibrada entre rendimiento, comodidad y valor. Ideal para quien busca un vehículo confiable sin comprometer características esenciales.`,

    "2": `Este ${car.make} ${car.model} es considerado el mejor en su categoría tras analizar precio, kilometraje, año y especificaciones técnicas. Con solo ${car.mileage.toLocaleString()} km en el historial, mantiene excelentes condiciones de funcionamiento. Su transmisión ${car.transmission} y combustible ${car.fuel} garantizan eficiencia operativa. Los ${car.specs.features.length} detalles de equipamiento demuestran una cuidadosa selección de comodidades. Una inversión sólida para quien valora calidad y longevidad.`,

    "3": `El ${car.make} ${car.model} emerge como ganador en esta comparativa multidimensional. Su combinación de precio accesible ($${car.price.toLocaleString()}) con motor de ${car.specs.power} y año ${car.year} hace de esta unidad una propuesta muy atractiva. Cuenta con ${car.specs.features.length} características de confort y seguridad que elevan significativamente su valor. Especialmente recomendado para compradores que buscan máxima relación valor-inversión.`,

    "4": `Analizando todos los parámetros evaluados, el ${car.make} ${car.model} ofrece la mejor experiencia general. Su motor ${car.specs.engine} de ${car.specs.power} proporciona potencia confiable, mientras que los ${car.specs.features.length} equipamientos integrados aseguran comodidad en todos los trayectos. Con ${car.mileage.toLocaleString()} km y año ${car.year}, representa una inversión inteligente. Altamente recomendado para conductores exigentes.`,

    "5": `Este ${car.make} ${car.model} es la recomendación principal tras evaluar exhaustivamente precio, condiciones mecánicas y características. A $${car.price.toLocaleString()}, ofrece un equilibrio excepcional. La transmisión ${car.transmission} y motor ${car.specs.power} garantizan rendimiento consistente. Sus ${car.specs.features.length} elementos de equipamiento reflejan atención al detalle. La mejor opción para quienes priorizan confiabilidad y economía.`,
  };

  const summary = summaries[car.id] || summaries["1"];
  return summary;
}

export function generateComparisonInsight(cars: Car[], metrics: ComparisonMetrics): string {
  const winner = cars.find(c => c.id === metrics.overallWinner.carId);
  if (!winner) return "";

  const insights = [
    `En términos de valor monetario, el ${winner.make} ${winner.model} ofrece la mejor propuesta.`,
    `Este modelo destaca por su balance entre funcionalidad y precio competitivo.`,
    `La evaluación consideró precio, kilometraje, año de fabricación, potencia y equipamiento.`,
    `Es la opción más recomendada para un comprador que busque máxima versatilidad.`,
  ];

  return insights.join(" ");
}

export function generateDetailOpinion(car: Car): string {
  const featureCount = car.specs.features.length;
  const priceTier =
    car.price <= 20000 ? "muy competitiva" : car.price <= 32000 ? "equilibrada" : "premium";
  const mileageState =
    car.mileage <= 30000 ? "bajo kilometraje" : car.mileage <= 80000 ? "kilometraje razonable" : "uso considerable";
  const equipmentView =
    featureCount >= 8 ? "muy buen nivel de equipamiento" : featureCount >= 4 ? "equipamiento correcto" : "equipamiento básico";

  return `La IA la ve como una opción ${priceTier}: combina ${mileageState}, ${equipmentView} y una ficha técnica que encaja bien para quien prioriza ${car.transmission.toLowerCase()} y ${car.fuel.toLowerCase()}.`;
}

export function generateImageAnalysisOpinion(car: Car): string {
  const imageCount = car.images?.length || 0;
  const presentationLevel =
    imageCount >= 8 ? "excelente" : imageCount >= 5 ? "muy buena" : imageCount >= 3 ? "aceptable" : "limitada";
  
  const yearCondition =
    car.year >= 2020 ? "moderno y bien cuidado" : car.year >= 2015 ? "en buenas condiciones" : "con signos de uso";
  
  const mileageVisualEstimate =
    car.mileage <= 30000 ? "impecable visualmente" : car.mileage <= 80000 ? "presenta buen estado general" : "muestra detalles típicos del uso";

  const colorAppeal =
    car.color.toLowerCase().includes("blanco") || car.color.toLowerCase().includes("plata")
      ? "un color versátil que facilita la venta y mantenimiento"
      : car.color.toLowerCase().includes("negro")
      ? "un color elegante y atemporal"
      : "un color diferenciador que refleja personalidad";

  return `Análisis visual: El vehículo presenta una ${presentationLevel} documentación fotográfica con ${imageCount} imágenes. Visualmente se aprecia ${yearCondition}, ${mileageVisualEstimate}. El ${car.make} ${car.model} luce en ${colorAppeal}, lo que suma atractivo al conjunto general de la presentación.`;
}

export interface DetailOpinions {
  characteristics: string;
  imageAnalysis: string;
}
