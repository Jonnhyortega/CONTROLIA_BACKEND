import { ZodError } from "zod";

export const validate = (schema) => async (req, res, next) => {
  try {
    // parseAsync is safe for synchronous or async refinements
    req.body = await schema.parseAsync(req.body ?? {});
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: "Payload inválido", issues: err.issues });
    }
    return next(err);
  }
};

export default validate;
