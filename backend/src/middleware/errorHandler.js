export const notFound = (req, res, next) => {
  const error = new Error(`No se encontró la ruta - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || res.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Error interno",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
