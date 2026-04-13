const { Vonage } = require('@vonage/server-sdk');

// Initialize Vonage client
const vonage = process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET
  ? new Vonage({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET
    })
  : null;

// Config
const isDevelopment = process.env.NODE_ENV === 'development';
const fromNumber = process.env.VONAGE_FROM_NUMBER || 'TESProperty';
const useMockSms = process.env.MOCK_SMS === 'true';
const canSendRealSms = Boolean(vonage) && !useMockSms;
const smsOverrideTo = (process.env.VERIFICATION_SMS_OVERRIDE_TO || '').trim();

/**
 * Format Philippine phone number to international format
 * @param {string} phone - Phone number (09XX or 639XX or +639XX)
 * @returns {string} - Formatted phone number (+639XXXXXXXXX)
 */
function formatPhoneNumber(phone) {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Convert 09XX to 639XX
  if (cleaned.startsWith('09')) {
    cleaned = '63' + cleaned.substring(1);
  }
  
  // Add + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generate 6-digit OTP code
 * @returns {string} - 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send SMS verification code
 * @param {string} phone - Phone number to send to
 * @param {string} otp - OTP code to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendVerificationSMS(phone, otp) {
  const targetPhone = smsOverrideTo || phone;
  const formattedPhone = formatPhoneNumber(targetPhone);
  const message = `Your TES Property verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  
  if (!canSendRealSms) {
    const modeLabel = isDevelopment ? 'DEVELOPMENT MOCK MODE' : 'MOCK MODE';
    const reason = useMockSms ? 'MOCK_SMS=true' : 'Vonage credentials not configured';

    console.log(`\n📱 SMS SERVICE - ${modeLabel}`);
    console.log('==================================');
    console.log(`To: ${formattedPhone}`);
    console.log(`From: ${fromNumber}`);
    console.log(`Message: ${message}`);
    console.log(`OTP: ${otp}`);
    console.log(`Reason: ${reason}`);
    console.log('==================================\n');
    
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
      mode: 'mock',
      deliveredTo: formattedPhone
    };
  }
  
  try {
    console.log(`📱 Sending real SMS to ${formattedPhone} via Vonage...`);
    
    const response = await vonage.sms.send({
      to: formattedPhone,
      from: fromNumber,
      text: message
    });
    
    if (response.messages[0].status === '0') {
      console.log(`✅ SMS sent successfully. Message ID: ${response.messages[0]['message-id']}`);
      return {
        success: true,
        messageId: response.messages[0]['message-id'],
        mode: 'live',
        deliveredTo: formattedPhone
      };
    } else {
      console.error(`❌ SMS failed: ${response.messages[0]['error-text']}`);
      return {
        success: false,
        error: response.messages[0]['error-text']
      };
    }
  } catch (error) {
    console.error('❌ SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
}

/**
 * Send verification SMS with OTP generation
 * @param {string} phone - Phone number to send to
 * @returns {Promise<{success: boolean, otp?: string, messageId?: string, error?: string}>}
 */
async function sendVerificationCode(phone) {
  const otp = generateOTP();
  const result = await sendVerificationSMS(phone, otp);
  
  if (result.success) {
    return {
      success: true,
      otp,
      messageId: result.messageId,
      mode: result.mode,
      deliveredTo: result.deliveredTo
    };
  }
  
  return {
    success: false,
    error: result.error
  };
}

module.exports = {
  sendVerificationCode,
  sendVerificationSMS,
  formatPhoneNumber,
  generateOTP,
  isDevelopment
};
