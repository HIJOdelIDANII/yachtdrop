/**
 * Server-side input validation for API routes.
 *
 * Lightweight — no external validation library needed.
 * Only validates at system boundaries (API input), not internal code.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d\s\-().]{6,20}$/;

export interface ValidationError {
  field: string;
  message: string;
}

export function validateOrderInput(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  const { deliveryType, contactName, contactPhone, contactEmail, items } = body;

  if (!deliveryType || !["DELIVERY", "PICKUP"].includes(deliveryType as string)) {
    errors.push({ field: "deliveryType", message: "Must be DELIVERY or PICKUP" });
  }

  if (!contactName || typeof contactName !== "string" || contactName.trim().length < 2) {
    errors.push({ field: "contactName", message: "Name must be at least 2 characters" });
  } else if (contactName.trim().length > 100) {
    errors.push({ field: "contactName", message: "Name must be under 100 characters" });
  }

  if (!contactPhone || typeof contactPhone !== "string" || !PHONE_RE.test(contactPhone.trim())) {
    errors.push({ field: "contactPhone", message: "Invalid phone number format" });
  }

  if (!contactEmail || typeof contactEmail !== "string" || !EMAIL_RE.test(contactEmail.trim())) {
    errors.push({ field: "contactEmail", message: "Invalid email address" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: "items", message: "Order must contain at least one item" });
  } else {
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>;
      if (!item.productId || typeof item.productId !== "string") {
        errors.push({ field: `items[${i}].productId`, message: "Invalid product ID" });
      }
      if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 99) {
        errors.push({ field: `items[${i}].quantity`, message: "Quantity must be between 1 and 99" });
      }
    }
  }

  // Sanitize notes — strip any HTML tags
  if (body.notes && typeof body.notes === "string") {
    body.notes = body.notes.replace(/<[^>]*>/g, "").slice(0, 500);
  }

  return errors;
}
