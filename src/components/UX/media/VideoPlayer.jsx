/**
 * Simple HTML5 video player wrapper.
 * Reconstructed after the original was lost to a OneDrive sync failure
 * (original kept as VideoPlayer.jsx.onedrive-dead).
 */
const VideoPlayer = ({ src, poster, autoPlay = false, loop = false, muted = false, style, ...rest }) => {
  if (!src) return null;
  return (
    <video
      controls
      src={src}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      style={{
        width: "100%",
        maxWidth: "100%",
        borderRadius: "var(--radius-xl, 12px)",
        background: "var(--gray-900, #171d1a)",
        ...style,
      }}
      {...rest}
    />
  );
};

export default VideoPlayer;
