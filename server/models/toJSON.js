// Makes API responses look like the old Firestore data: { id, ...fields }
export function applyJsonTransform(schema) {
  schema.set("toJSON", {
    virtuals: false,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      return ret;
    },
  });
}
