import {
  createStaff as createStaffService,
  getAllStaff as getAllStaffService,
  getStaffById as getStaffByIdService,
  updateStaff as updateStaffService,
  deleteStaff as deleteStaffService,
  getProfile as getProfileService,
  updateProfile as updateProfileService,
} from "./users.service";

const createStaff = async (
  req: any,
  res: any
) => {
  try {
    const user =
      await createStaffService(req.body);

    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const getAllStaff = async (
  req: any,
  res: any
) => {
  try {
    const users =
      await getAllStaffService();

    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getStaffById = async (
  req: any,
  res: any
) => {
  try {
    const user =
      await getStaffByIdService(
        req.params.id
      );

    return res.json(user);
  } catch (error: any) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateStaff = async (
  req: any,
  res: any
) => {
  try {
    const user =
      await updateStaffService(
        req.params.id,
        req.body
      );

    return res.json(user);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const deleteStaff = async (
  req: any,
  res: any
) => {
  try {
    const response =
      await deleteStaffService(
        req.params.id
      );

    return res.json(response);
  } catch (error: any) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const getProfile = async (
  req: any,
  res: any
) => {
  try {
    const user =
      await getProfileService(
        req.user.id
      );

    return res.json(user);
  } catch (error: any) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

const updateProfile = async (
  req: any,
  res: any
) => {
  try {
    const user =
      await updateProfileService(
        req.user.id,
        req.body
      );

    return res.json(user);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

export {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  getProfile,
  updateProfile,
};