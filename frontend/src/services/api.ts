export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status}`)
  }

  return response.json() as Promise<T>
}
