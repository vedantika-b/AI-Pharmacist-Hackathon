"""
SMS Service for sending notifications.
Supports both Twilio (real SMS) and mock mode for testing.
"""

import logging
import os
from datetime import datetime
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# Try to import Twilio
try:
    from twilio.rest import Client
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False
    logger.warning("Twilio not installed. SMS will run in mock mode. Install with: pip install twilio")


class SMSService:
    """Service for sending SMS notifications."""
    
    def __init__(self):
        """Initialize SMS service with Twilio or mock mode."""
        self.sent_messages = []  # Store sent messages for tracking
        
        # Initialize Twilio if credentials are available
        self.twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        
        self.use_real_sms = (
            TWILIO_AVAILABLE and 
            self.twilio_sid and 
            self.twilio_token and 
            self.twilio_phone
        )
        
        if self.use_real_sms:
            self.client = Client(self.twilio_sid, self.twilio_token)
            logger.info("🚀 SMS Service initialized with REAL Twilio integration")
        else:
            self.client = None
            logger.info("📝 SMS Service running in MOCK mode (no real SMS sent)")
    
    async def send_sms(
        self,
        phone_number: str,
        message: str,
        alert_id: Optional[str] = None
    ) -> Dict:
        """
        Send SMS notification.
        
        Args:
            phone_number: Recipient phone number
            message: SMS message content
            alert_id: Optional alert ID for tracking
        
        Returns:
            Dict with status and details
        """
        try:
            message_id = None
            provider = "MOCK"
            
            # Send real SMS via Twilio if configured
            if self.use_real_sms and self.client:
                try:
                    twilio_message = self.client.messages.create(
                        body=message,
                        from_=self.twilio_phone,
                        to=phone_number
                    )
                    message_id = twilio_message.sid
                    provider = "TWILIO"
                    logger.info(f"✅ REAL SMS SENT to {phone_number} via Twilio (SID: {message_id[:10]}...)")
                except Exception as twilio_error:
                    logger.error(f"Twilio SMS failed: {twilio_error}. Falling back to mock.")
                    provider = "MOCK_FALLBACK"
            else:
                logger.info(f"📱 MOCK SMS to {phone_number}: {message[:50]}...")
            
            # Track message
            sms_record = {
                "phone_number": phone_number,
                "message": message,
                "alert_id": alert_id,
                "sent_at": datetime.now().isoformat(),
                "status": "sent",
                "provider": provider,
                "message_id": message_id or f"SMS-{alert_id or 'NOTIF'}-{int(datetime.now().timestamp())}"
            }
            
            self.sent_messages.append(sms_record)
            
            return {
                "success": True,
                "message_id": sms_record["message_id"],
                "status": "sent",
                "phone_number": phone_number,
                "sent_at": sms_record["sent_at"],
                "provider": provider,
                "is_real_sms": provider == "TWILIO"
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            return {
                "success": False,
                "error": str(e),
                "status": "failed"
            }
    
    async def send_refill_alert_sms(
        self,
        phone_number: str,
        medicine_name: str,
        days_remaining: int,
        alert_status: str
    ) -> Dict:
        """
        Send a refill alert SMS.
        
        Args:
            phone_number: Patient phone number
            medicine_name: Medicine name
            days_remaining: Days until refill needed
            alert_status: Alert severity (critical, low, safe)
        
        Returns:
            Dict with sending status
        """
        # Create message based on urgency
        if alert_status == "critical":
            message = f"🚨 URGENT: Your {medicine_name} stock is critically low! Only {days_remaining} days remaining. Please order immediately. - AI Pharmacist"
        elif alert_status == "low":
            message = f"⚠️ REMINDER: Your {medicine_name} needs refill in {days_remaining} days. Please order soon to avoid running out. - AI Pharmacist"
        else:
            message = f"ℹ️ INFO: Your {medicine_name} has {days_remaining} days of supply remaining. You're well stocked! - AI Pharmacist"
        
        return await self.send_sms(phone_number, message, f"refill-{medicine_name}")
    
    async def send_bulk_sms(
        self,
        recipients: list,
        message: str
    ) -> Dict:
        """
        Send SMS to multiple recipients.
        
        Args:
            recipients: List of phone numbers
            message: Message to send
        
        Returns:
            Dict with bulk send status
        """
        results = {
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "details": []
        }
        
        for phone in recipients:
            result = await self.send_sms(phone, message)
            if result["success"]:
                results["sent"] += 1
            else:
                results["failed"] += 1
            results["details"].append(result)
        
        return results
    
    def get_sent_messages(self, limit: int = 50) -> list:
        """Get recent sent messages."""
        return self.sent_messages[-limit:]


# Global SMS service instance
sms_service = SMSService()
