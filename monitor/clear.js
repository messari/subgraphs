import { clearChannel, deleteSingleMessage, getChannel } from "./messageDiscord.js";
import 'dotenv/config'

clearChannel(process.env.CHANNEL_ID);