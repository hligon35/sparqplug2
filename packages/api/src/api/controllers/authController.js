import { asyncHandler } from '../../utils/asyncHandler.js';
import { UserService } from '../../services/UserService.js';

export const me = asyncHandler(async (req, res) => {
  const profile = await UserService.getUserProfile(req.user.uid);
  res.json({ user: profile });
});
