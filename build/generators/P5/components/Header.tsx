const Header = () => {
  return (
    <div className='p5-sidebar-header'>
      <img
        alt='Persona 5 logo'
        className='p5-sidebar-logo'
        src='./images/logos/persona5logo.png'
        width='44'
        height='27'
      />
      <div className='p5-sidebar-titles'>
        <div className='p5-sidebar-title-optima'>DIALOGUE GENERATOR</div>
        <div className='p5-sidebar-title-krsm'>DIALOGUE GENERATOR</div>
        <div className='p5-sidebar-title-jp' lang='ja'>対話ジェネレータ</div>
      </div>
    </div>
  );
};

export default Header;
