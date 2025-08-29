import React, { useState, useCallback } from 'react'
import { BsStar, BsStarFill } from 'react-icons/bs'
import { useSubsContext } from '../MySubs';
import { FavoriteButtonProps } from '../../types';

const FavoriteButton = ({
  sub, 
  favorited, 
  isUser = false, 
  forceShow = false
}: FavoriteButtonProps & {
  favorited?: boolean;
  isUser?: boolean;
  forceShow?: boolean;
}) => {
  const subsContext = useSubsContext();
 // const [favorited, setFavorited] = useState(sub?.data?.user_has_favorited ?? false); 
  const handleClick = useCallback(async() => {
    const subName = typeof sub === 'string' ? sub : sub?.data?.display_name;
    let res = await subsContext.favorite(!favorited, subName, isUser); 
  }, [subsContext, favorited, sub, isUser]);

  return (
    <button
    aria-label="favorite"
    onClick={(e) => {e.stopPropagation(); e.preventDefault(); handleClick()}}
        className={
          (favorited || forceShow ? " " : " md:opacity-0 md:group-hover:opacity-100 ")  + " outline-none select-none"
        }
      >
        {favorited ? (
          <BsStarFill className="flex-none w-5 h-5 transition text-th-accent hover:scale-95 hover:opacity-60 " />
        ) : (
          <BsStar className="flex-none w-5 h-5 transition hover:text-th-accent hover:scale-105" />
        )}
      </button>
  )
}

export default FavoriteButton