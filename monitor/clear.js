import { clearChannel, getAllThreadsToClear } from "./messageDiscord.js";
import 'dotenv/config'

getAllThreadsToClear(Date.now(), process.env.CHANNEL_ID);
clearChannel(process.env.PROD_CHANNEL)