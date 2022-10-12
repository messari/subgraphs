import { clearAllThreads, clearChannel, deleteSingleMessage, getAllThreadsToClear, getChannel } from "./messageDiscord.js";
import 'dotenv/config'

getAllThreadsToClear(Date.now(), process.env.CHANNEL_ID);