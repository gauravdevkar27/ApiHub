import ApiError from '../utils/ApiError.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ApiError(400, 'Validation failed.', errors);
  }

  // Replace req.body with parsed/transformed data (e.g. trimmed strings)
  req.body = result.data;
  next();
};

export default validate;
