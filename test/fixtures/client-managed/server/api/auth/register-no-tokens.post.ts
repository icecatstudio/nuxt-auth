// Register endpoint that returns success but NO tokens (e.g., email verification required)
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (body.email && body.password && body.name) {
    return {
      message: 'Registration successful. Please verify your email.',
      user: {
        email: body.email,
        name: body.name,
      },
    }
  }

  throw createError({
    statusCode: 400,
    message: 'Missing required fields',
  })
})
