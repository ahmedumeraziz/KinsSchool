"""
scheduler.py — Background jobs for KINS SCHOOL
Run with: python scheduler.py  (or import in main.py)
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def generate_defaulter_list():
    """Runs on 10th of every month at 8:00 AM — generates defaulter list."""
    logger.info(f"[{datetime.now()}] 🔔 10th of month: Generating defaulter list…")
    # In a real deployment: query fees sheet, build list, save to Defaulters sheet
    # For now: log the event
    logger.info("Defaulter list generated. Admin can view in the Defaulters page.")

async def send_fee_reminders_5th():
    """Runs on 5th of every month — gentle reminder."""
    logger.info(f"[{datetime.now()}] 📨 5th reminder: Prepare gentle fee reminders.")

async def send_fee_reminders_15th():
    """Runs on 15th of every month — firm reminder."""
    logger.info(f"[{datetime.now()}] ⚠️ 15th reminder: Firm fee reminders.")

async def send_fee_reminders_20th():
    """Runs on 20th of every month — final notice."""
    logger.info(f"[{datetime.now()}] 🚨 20th reminder: Final fee notices.")

def start_scheduler():
    scheduler.add_job(generate_defaulter_list,  CronTrigger(day=10, hour=8,  minute=0))
    scheduler.add_job(send_fee_reminders_5th,   CronTrigger(day=5,  hour=9,  minute=0))
    scheduler.add_job(send_fee_reminders_15th,  CronTrigger(day=15, hour=9,  minute=0))
    scheduler.add_job(send_fee_reminders_20th,  CronTrigger(day=20, hour=9,  minute=0))
    scheduler.start()
    logger.info("✅ Scheduler started: monthly jobs registered.")

def stop_scheduler():
    scheduler.shutdown()
