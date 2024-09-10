import { Router } from "express";
import {
  ChangeCurrentPassword,
  GetCurrentUser,
  GetWatchHistory,
  UpdateCoverImage,
  UpdateUserAvatar,
  UpdateUserDetails,
  UserLogOut,
  UserLogin,
  getUserChannelProfile,
  refreshAcesstoken,
  registerUser,
} from "../controllers/user.control.js";
import { upload } from "../middlewares/multer.mid.js";
import { VerifyJWT } from "../middlewares/auth.middle.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(UserLogin);
router.route("/logout").post(VerifyJWT, UserLogOut);

// secure routes
router.route("/refresh-token").post(refreshAcesstoken);
router.route("/change-password").post(VerifyJWT, ChangeCurrentPassword);
router.route("/current-user").get(VerifyJWT, GetCurrentUser);
router.route("/update-account").patch(VerifyJWT, UpdateUserDetails);
router
  .route("/update-avatar")
  .patch(VerifyJWT, upload.single("avatar"), UpdateUserAvatar);
router
  .route("/update-coverimage")
  .path(VerifyJWT, upload.single("coverImage"), UpdateCoverImage);

router.route("/channels/:username").get(VerifyJWT, getUserChannelProfile);
router.route("/watchhistory").get(VerifyJWT, GetWatchHistory);

export default router;
