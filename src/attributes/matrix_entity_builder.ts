import { AID, AttributeInfo, KEY, Matrix, PID, } from '../';

// MatrixEntityBuilder collects Attribute and Entity values that will later be
// used to generate an Entity key which can be used to lookup the specific
// PID.
//
// For example, we might have a `cone` which is configured by `flavor` and
// `size` dimensions.
//
// Adding the entity `cone` and the attributes `small` and `chocolate` will
// allow us to generate a key which yields the PID for a `small chocolate cone`.
export class MatrixEntityBuilder {
    private readonly info: AttributeInfo;

    private pid: PID | undefined = undefined;

    private readonly dimensionIdToAttribute = new Map<PID, PID>();

    constructor(info: AttributeInfo) {
        this.info = info;
    }

    hasPID(): boolean {
        return this.pid !== undefined;
    }

    setPID(pid: PID) {
        if (this.pid === undefined) {
            this.pid = pid;
            return true;
        } else {
            const message = `attempting to overwrite entity ${
                this.pid
                } with ${pid}`;
            throw TypeError(message);
        }
    }

    addAttribute(attributeID: AID): boolean {
        const coordinate = this.info.getAttributeCoordinates(attributeID);
        if (!coordinate) {
            const message = `unknown attribute ${attributeID}.`;
            throw TypeError(message);
        } else if (this.dimensionIdToAttribute.has(coordinate.dimension.id)) {
            return false;
        } else {
            this.dimensionIdToAttribute.set(
                coordinate.dimension.id,
                attributeID,
            );
            return true;
        }
    }

    getKey(): KEY | undefined {
        if (this.pid === undefined) {
            throw TypeError(`no pid set`);
        }
        let key: KEY | undefined = undefined;
        const matrix: Matrix = this.info.getMatrixForEntity(this.pid);

        key = matrix.getKey(
            this.pid,
            this.dimensionIdToAttribute,
            this.info
        );
        return key;
    }

    // Iterator for PIDs of attributes that aren't associated with dimensions
    // of the entity's matrix. This includes all collected attributes in the
    // cases where the entity has not been set and where the entity is not
    // associated with a matrix.
    *getUnusedAttributes(): IterableIterator<AID> {
        let matrix: Matrix | undefined = undefined;

        // If we've collected an entity, attempt to get its matrix.
        if (this.pid !== undefined) {
            matrix = this.info.getMatrixForEntity(this.pid);
        }

        // If we didn't get a matrix (either no entity or entity didn't specify
        // a matrix), then create an empty matrix.
        if (!matrix) {
            matrix = new Matrix(0, []);
        }

        for (const [did, aid] of this.dimensionIdToAttribute.entries()) {
            if (!matrix.hasDimension(did)) {
                yield aid;
            }
        }
    }
}
