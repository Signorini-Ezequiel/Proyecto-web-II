export async function login(email: string, password: string) {
  console.log('Mock login:', { email, password })
  return { token: 'mock-token' }
}
