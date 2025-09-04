import mongoose, { Schema, Document } from 'mongoose';

export interface IRolePermission extends Document {
  role: "admin" | "cs" | "auditor" | "finance";
  permissions: {
    module: "user" | "order" | "payment" | "nurse" | "content";
    actions: ("create" | "read" | "update" | "delete" | "export")[];
  }[];
}

const rolePermissionSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["admin", "cs", "auditor", "finance"],
      required: true,
    },
    permissions: [
      {
        module: {
          type: String,
          enum: ["user", "order", "payment", "nurse", "content"],
          required: true,
        },
        actions: {
          type: [String],
          enum: ["create", "read", "update", "delete", "export"],
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: "role_permissions",
  }
);

rolePermissionSchema.index({ role: 1 });

export const RolePermission = mongoose.model<IRolePermission>('RolePermission', rolePermissionSchema); 