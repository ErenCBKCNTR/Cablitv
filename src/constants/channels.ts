export type ChannelType = 'radio' | 'tv';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  streamUrl: string;
  logoUrl?: string; // Optional logo URL
}

// Since reliable streaming URLs for TV and Radio can change frequently,
// using some well-known public stream URLs for demonstration purposes.
export const CHANNELS: Channel[] = [
  // Radio Channels - Updated with robust Icecast/Shoutcast streams
  {
    id: 'kralpop',
    name: 'Kral Pop Radyo',
    type: 'radio',
    streamUrl: 'https://kralpopradyo.radyotvonline.net/kralpop/smil:kralpop.smil/playlist.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/tr/8/87/Kral_Pop_Radyo.png',
  },
  {
    id: 'superfm',
    name: 'Süper FM',
    type: 'radio',
    streamUrl: 'http://17703.live.streamtheworld.com/SUPER_FM_SC', // Reverting to http to avoid SSL cert issues often found on older stream servers
    logoUrl: 'https://upload.wikimedia.org/wikipedia/tr/d/d3/S%C3%BCper_FM_logosu.png',
  },
  {
    id: 'virginradio',
    name: 'Virgin Radio Türkiye',
    type: 'radio',
    streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/VIRGIN_RADIO.mp3', // Correct, robust endpoint for Karnaval group
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Virgin_Radio_Turkey_logo.png',
  },
  {
    id: 'joyturk',
    name: 'JoyTürk',
    type: 'radio',
    streamUrl: 'http://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK.mp3',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/tr/6/6f/JoyTurk_Logosu.png',
  },
  {
    id: 'trtfm',
    name: 'TRT FM',
    type: 'radio',
    streamUrl: 'https://trtcanlifm-vh.akamaihd.net/i/TRTFM_1@118440/master.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/TRT_FM_logo.png',
  },

  // TV Channels
  {
    id: 'trt1',
    name: 'TRT 1',
    type: 'tv',
    streamUrl: 'https://tv-trt1.medya.trt.com.tr/master.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/TRT_1_logo.png',
  },
  {
    id: 'trthaber',
    name: 'TRT Haber',
    type: 'tv',
    streamUrl: 'https://tv-trthaber.medya.trt.com.tr/master.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/TRT_Haber_logo.png',
  },
  {
    id: 'trtspor',
    name: 'TRT Spor',
    type: 'tv',
    streamUrl: 'https://tv-trtspor1.medya.trt.com.tr/master.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/84/TRT_Spor_logo.png',
  },
  {
    id: 'trtbelgesel',
    name: 'TRT Belgesel',
    type: 'tv',
    streamUrl: 'https://tv-trtbelgesel.medya.trt.com.tr/master.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/TRT_Belgesel_logo.png',
  },
  {
    id: 'trtcocuk',
    name: 'TRT Çocuk',
    type: 'tv',
    streamUrl: 'https://tv-trtcocuk.medya.trt.com.tr/master.m3u8',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/TRT_%C3%87ocuk_logo.png',
  }
];
