import { calculateReviewHash } from '../../utils/hash';
import { encryptData } from '../../utils/cipher';

export default {
  // ทำงานก่อนบันทึกรีวิวใหม่ (Create)
  async beforeCreate(event: any) {
    const { data } = event.params;
    // 1. คำนวณ MD5 Checksum จากข้อมูลจริง (phone ยังเป็น plaintext)
    data.integrity_hash = calculateReviewHash(data);
    // 2. เข้ารหัสเบอร์โทรศัพท์ด้วย AES-256-CBC ก่อนบันทึกลง SQLite
    if (data.phone) data.phone = encryptData(data.phone);
  },

  // ทำงานก่อนแก้ไขรีวิวเดิม (Update)
  async beforeUpdate(event: any) {
    const { data, where } = event.params;
    if (!data) return;

    let existing: any = null;
    try {
      existing = await strapi.db.query('api::review.review').findOne({ where: where ?? {} });
    } catch (error) {
      existing = null;
    }

    const merged = existing ? { ...existing, ...data } : data;
    data.integrity_hash = calculateReviewHash(merged);
    if (data.phone) data.phone = encryptData(data.phone);
  },
};
