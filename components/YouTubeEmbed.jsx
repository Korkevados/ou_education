/** @format */

export default function YouTubeEmbed() {
  return (
    <div className="relative w-full h-full">
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        src="https://www.youtube.com/embed/XVt8oVYFGJU"
        title="OU הסבר"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
