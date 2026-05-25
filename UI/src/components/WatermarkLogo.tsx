import logo from '../../assets/logo.jpg';

export function WatermarkLogo() {
  return (
    <div className="watermark-logo">
      <img src={logo} alt="" aria-hidden="true" />
    </div>
  );
}
