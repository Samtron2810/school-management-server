import Parent from "../models/Parent.js";
import Student from "../models/Student.js";
import ParentStudent from "../models/ParentStudent.js";

import ApiError from "../utils/ApiError.js";

const linkParentStudent = async (data) => {
  const parent = await Parent.findById(data.parent);

  if (!parent) {
    throw new ApiError(404, "Parent not found.");
  }

  const student = await Student.findById(data.student);

  if (!student) {
    throw new ApiError(404, "Student not found.");
  }

  const duplicate = await ParentStudent.findOne({
    parent: parent._id,
    student: student._id,
  });

  if (duplicate) {
    throw new ApiError(400, "Parent already linked to this student.");
  }

  const parentCount = await ParentStudent.countDocuments({
    student: student._id,
    isActive: true,
  });

  if (parentCount >= 2) {
    throw new ApiError(
      400,
      "A student cannot have more than two active parents.",
    );
  }

  if (data.isPrimaryContact) {
    const existingPrimary = await ParentStudent.findOne({
      student: student._id,
      isPrimaryContact: true,
      isActive: true,
    });

    if (existingPrimary) {
      throw new ApiError(400, "Student already has a primary contact.");
    }
  }

  if (data.isEmergencyContact) {
    const existingEmergency = await ParentStudent.findOne({
      student: student._id,
      isEmergencyContact: true,
      isActive: true,
    });

    if (existingEmergency) {
      throw new ApiError(400, "Student already has an emergency contact.");
    }
  }

  return await ParentStudent.create({
    parent: parent._id,
    student: student._id,
    relationship: data.relationship,
    isPrimaryContact: data.isPrimaryContact || false,
    canReceiveResults: data.canReceiveResults ?? true,
    canPickupStudent: data.canPickupStudent ?? true,
    isEmergencyContact: data.isEmergencyContact || false,
    livesWithStudent: data.livesWithStudent ?? true,
  });
};

const getParentsOfStudent = async (studentId) => {
  return await ParentStudent.find({
    student: studentId,
    isActive: true,
  }).populate({
    path: "parent",
    populate: {
      path: "user",
      select: "firstName lastName otherName email phoneNumber",
    },
  });
};

const getChildrenOfParent = async (parentId) => {
  return await ParentStudent.find({
    parent: parentId,
    isActive: true,
  }).populate({
    path: "student",
    populate: {
      path: "user",
      select: "firstName lastName otherName",
    },
  });
};

const removeParentStudent = async (id) => {
  const relationship = await ParentStudent.findById(id);

  if (!relationship) {
    throw new ApiError(404, "Relationship not found.");
  }

  relationship.isActive = false;

  await relationship.save();

  return relationship;
};

export default {
  linkParentStudent,
  getParentsOfStudent,
  getChildrenOfParent,
  removeParentStudent,
};
