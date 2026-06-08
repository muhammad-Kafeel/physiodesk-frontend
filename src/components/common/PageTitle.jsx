import { useEffect } from 'react';

const PageTitle = ({ title }) => {
  useEffect(() => {
    document.title = `${title} | PhysioDesk`;
  }, [title]);
  return null;
};

export default PageTitle;
