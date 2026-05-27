/**
 * Convierte un ID numérico de usuario (del JWT) a un UUID determinista para Prisma
 * Esto es necesario porque el sistema usa IDs numéricos en memoria para usuarios
 * pero Prisma Favoritos espera UUIDs
 * 
 * Ejemplo: 1 -> "00000001-0000-0000-0000-000000000000"
 */
export function numericIdToUuid(numericId: number): string {
  const padded = String(numericId).padStart(8, '0');
  return `${padded}-0000-0000-0000-000000000000`;
}

/**
 * Verifica si una cadena es un UUID en formato esperado
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
