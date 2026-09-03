const PageLoader = ({ message = 'Loading…' }) => (
  <div className="flare-loader-overlay">
    <div className="flare-loader-ring" />
    <p className="flare-loader-text">{message}</p>
  </div>
);

export default PageLoader;
