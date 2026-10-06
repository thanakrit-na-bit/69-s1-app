/**
 * review controller
 */

import { factories } from '@strapi/strapi';
import { calculateReviewHash } from '../utils/hash';
import { decryptData, isEncrypted } from '../utils/cipher';

const exposeReview = (review: any) => {
  if (review && typeof review === 'object' && review.phone) {
    review.phone = decryptData(review.phone);
  }
  return review;
};

export default factories.createCoreController('api::review.review', ({ strapi }) => ({
  // ถอดรหัสเบอร์โทรศัพท์อัตโนมัติเมื่อเรียกดูข้อมูลผ่าน API
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    if (Array.isArray(data)) data.forEach(exposeReview);
    return { data, meta };
  },

  async findOne(ctx) {
    const { data, meta } = await super.findOne(ctx);
    exposeReview(data);
    return { data, meta };
  },

  // Endpoint ตรวจสอบการถูกแอบแก้ไขข้อมูล (Tamper Verification)
  async verifyIntegrity(ctx) {
    const { id } = ctx.params;

    const where: any = { $or: [{ documentId: id }] };
    if (/^\d+$/.test(String(id))) where.$or.push({ id: Number(id) });

    const review: any = await strapi.db.query('api::review.review').findOne({ where });

    if (!review) {
      return ctx.notFound(`Review not found: ${id}`);
    }

    const computedHash = calculateReviewHash(review);
    const storedHash = review.integrity_hash;
    const isValid = Boolean(storedHash && storedHash === computedHash);

    return {
      review_id: review.documentId,
      reviewer: review.reviewer_name,
      score: review.score,
      is_valid: isValid,
      status: isValid ? 'SECURE_AND_VERIFIED' : 'TAMPER_DETECTED (DATA MODIFIED)',
      message: isValid
        ? 'ข้อมูลถูกต้องสมบูรณ์ ไม่มีการถูกแอบแก้ไข'
        : 'แจ้งเตือนความปลอดภัย! ข้อมูลถูกแอบแก้ไขโดยตรงในฐานข้อมูล (MD5 Checksum Mismatch)',
      security_info: {
        confidentiality: {
          phone_status: isEncrypted(review.phone) ? 'AES-256 ENCRYPTED' : 'PLAINTEXT',
          decrypted_phone: decryptData(review.phone),
        },
        integrity: {
          algorithm: 'MD5',
          stored_hash: storedHash,
          computed_hash: computedHash,
        },
      },
    };
  },
}));
