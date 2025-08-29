import React from 'react';
import Toggles from "../Toggles";

const MediaSettings: React.FC = () => (
  <>
    {[
      "disableEmbeds",
      "preferEmbeds",
      "embedsEverywhere",
      "expandImages",
      "autoplay",
      "hoverplay",
      "audioOnHover",
      "nsfw",
    ].map((s: any) => (
      <Toggles
        key={s}
        setting={s}
        withSubtext={true}
        externalStyles={"rounded-lg group hover:bg-th-highlight p-2 cursor-pointer"}
      />
    ))}
  </>
);

export default MediaSettings;

