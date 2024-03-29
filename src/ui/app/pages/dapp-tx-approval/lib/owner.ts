export type Owner =
    | {
          AddressOwner: string;
      }
    | {
          ObjectOwner: string;
      }
    | {
          Shared: {
              initial_shared_version: number | string | null;
          };
      }
    | 'Immutable';

const owner = (owner?: Owner, you?: string) => {
    if (!owner) return 'Immutable';
    if (typeof owner === 'string') return owner;
    if ('AddressOwner' in owner) {
        if (you && owner.AddressOwner === you) return 'You';
        return owner.AddressOwner;
    }
    if ('ObjectOwner' in owner) return owner.ObjectOwner;
    if ('Shared' in owner) return 'Shared';
    return 'Immutable';
};

export default owner;
