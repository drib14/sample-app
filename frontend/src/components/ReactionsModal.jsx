import React from 'react';
import ModalWrapper from './ModalWrapper';
import Avatar from './Avatar';

const ReactionsModal = ({ isOpen, onClose, reactions }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Reactions">
      <div className="p-2">
        {reactions && reactions.length > 0 ? (
          reactions.map((reaction, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-brown-50 rounded-xl transition-colors">
              <Avatar user={reaction.user} size="md" />
              <div className="flex-1">
                <p className="font-semibold text-brown-900 text-sm">
                  {reaction.user.firstName} {reaction.user.lastName}
                </p>
                <p className="text-xs text-brown-500">@{reaction.user.username}</p>
              </div>
              <div className="text-2xl">{reaction.emoji}</div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-brown-400">
            No reactions yet.
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

export default ReactionsModal;
