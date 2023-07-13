@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<BaseEntity> {
  constructor(dataSource: DataSource, private readonly cls: ClsService) {
    dataSource.subscribers.push(this);
  }
  listenTo() {
    return BaseEntity;
  }
  beforeInsert(event: InsertEvent<BaseEntity>) {
    event.entity.createdBy = this.cls.get('user');
  }

  beforeUpdate(event: UpdateEvent<BaseEntity>) {
    event.entity.updatedBy = this.cls.get('user');
  }
}
