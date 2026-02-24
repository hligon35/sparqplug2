import { asyncHandler } from '../../utils/asyncHandler.js';
import { AIService } from '../../services/AIService.js';

export const run = asyncHandler(async (req, res) => {
  const result = await AIService.run({ input: req.body, user: req.user });
  res.json(result);
});
