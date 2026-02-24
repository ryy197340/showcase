export default function Copyright() {
  return (
    <div className="flex cursor-default justify-between border-t  border-lightGray px-5 py-4 text-2xs md:justify-center md:px-10">
      <span id="accessibilityMenu" className="md:hidden">
        Accessibility Menu
      </span>
      <span>
        ©{' '}
        {
          new Date().getFullYear() // returns the current year
        }{' '}
        J.McLaughlin. All Rights Reserved.
      </span>
    </div>
  );
}
