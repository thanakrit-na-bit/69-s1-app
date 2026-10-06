import crypto from 'crypto';
import { decryptData } from './cipher';

/**
 * คำนวณค่า MD5 Checksum จากข้อมูลสำคัญของรีวิว
 * ใช้ตรวจจับว่าคะแนน (score) หรือข้อมูลรีวิวถูกแอบแก้ไขใน Database หรือไม่
 */
export function calculateReviewHash(review: {
  reviewer_name?: string | null;
  score?: number | string | null;
  comment?: string | null;
  phone?: string | null;
}): string {
  const plainPhone = decryptData(review.phone);
  const rawScore = review.score;
  let score = '';
  if (rawScore !== null && rawScore !== undefined && rawScore !== '') {
    const num = Number(rawScore);
    score = Number.isNaN(num) ? String(rawScore) : String(num);
  }
  const payload = [
    review.reviewer_name || '',
    score,
    review.comment || '',
    plainPhone || '',
  ].join('::');
  return crypto.createHash('md5').update(payload, 'utf8').digest('hex');
}
